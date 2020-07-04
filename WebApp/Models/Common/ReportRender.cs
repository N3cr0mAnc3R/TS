using Microsoft.Reporting.WebForms;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Principal;
using System.Web;

namespace WebApp.Models.Common
{

    public class ReportRender
    {
        protected class ReportCredentials : IReportServerCredentials
        {
            private string _UserName;
            private string _PassWord;
            private string _DomainName;

            public ReportCredentials(string UserName, string PassWord, string DomainName)
            {
                _UserName = UserName;
                _PassWord = PassWord;
                _DomainName = DomainName;
            }

            public WindowsIdentity ImpersonationUser
            {
                get
                {
                    return null;
                    //return WindowsIdentity.GetCurrent();
                }
            }

            public ICredentials NetworkCredentials
            {
                get
                {
                    //return null;
                    // use NetworkCredentials
                    return new NetworkCredential(_UserName, _PassWord, _DomainName);
                }
            }

            public bool GetFormsCredentials(out Cookie authCookie, out string user, out string password, out string authority)
            {

                // not use FormsCredentials unless you have implements a custom autentication.
                authCookie = null;
                user = password = authority = null;
                return false;
            }

        }

        public Uri ServerUrl { get; set; }
        public string Path { get; set; }
        public IReportServerCredentials Credentials { get; set; }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="serverUrl">Пример: http://reports.ncfu.ru/ReportServer</param>
        /// <param name="path">Пример: /Программы дисциплин/Сведения одисциплине</param>
        /// <param name="user"></param>
        /// <param name="password"></param>
        /// <param name="domain"></param>
        public ReportRender(string serverUrl, string path, string user, string password, string domain)
            : this(new Uri(serverUrl), path, new ReportCredentials(user, password, domain))
        {
        }

        public ReportRender(Uri serverUrl, string path, IReportServerCredentials credentials)
        {
            ServerUrl = serverUrl;
            Path = path;
            Credentials = credentials;
        }

        public byte[] Render(string format, Dictionary<string, object> parameters)
        {
            ReportViewer reportViewer = new ReportViewer();
            reportViewer.ProcessingMode = ProcessingMode.Remote;
            reportViewer.ServerReport.ReportPath = Path;

            reportViewer.ServerReport.ReportServerUrl = ServerUrl;
            reportViewer.ServerReport.ReportServerCredentials = Credentials;

            if (parameters != null)
            {
                reportViewer.ServerReport.SetParameters(parameters.Select(pair => new ReportParameter(pair.Key, pair.Value.ToString())).ToArray());
            }

            reportViewer.ServerReport.Refresh();

            return reportViewer.ServerReport.Render(format);

        }

        public byte[] Render(string format, object parameters)
        {
            Dictionary<string, object> dictionaryParameters = new Dictionary<string, object>();

            foreach (var info in parameters.GetType().GetProperties())
            {
                dictionaryParameters[info.Name] = info.GetValue(parameters);
            }

            return Render(format, dictionaryParameters);
        }
    }
}