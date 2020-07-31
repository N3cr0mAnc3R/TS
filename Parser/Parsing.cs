using DocumentFormat.OpenXml.Packaging;
using Microsoft.Office.Interop.Word;
using OpenXmlPowerTools;
using SautinSoft.Document;
using System;
using System.Collections.Generic;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml;
using System.Xml.Linq;

namespace Parser
{
    public class Parsing
    {
        public string ParseAsync(string path, string outputPath, bool IsChecked = true)
        {
            StringBuilder text = new StringBuilder();

            var byteArray = File.ReadAllBytes(path);
            object oMissing = System.Reflection.Missing.Value;
            Application word = new Application();
            Object filename = (Object)path;
            Document doc = word.Documents.Open(ref filename, ref oMissing,
        ref oMissing, ref oMissing, ref oMissing, ref oMissing, ref oMissing,
        ref oMissing, ref oMissing, ref oMissing, ref oMissing, ref oMissing,
        ref oMissing, ref oMissing, ref oMissing, ref oMissing);
            try
            {


                object outputFileName;
                //object fileFormat = WdSaveFormat.wdFormatPDF;
                //outputFileName = GetExeDirectory() + "../../../WebApp/App_Data/TMP/" + path.Substring(path.LastIndexOf('\\') + 1);
                
                object fileFormat = WdSaveFormat.wdFormatPDF;
                //outputFileName = GetExeDirectory().Substring(0, GetExeDirectory().LastIndexOf('/')).Substring(0, GetExeDirectory().LastIndexOf('/')).Substring(0, GetExeDirectory().LastIndexOf('/')) + "/Content/TMP/" + path.Substring(path.LastIndexOf('\\') + 1).Replace(".doc", ".pdf");
                outputFileName = outputPath.Replace(".doc", ".pdf");
                doc.Content.Font.Size = 12;
                if (!IsChecked)
                {
                    doc.Content.Font.Bold = 0;
                    doc.Content.Font.Name = "Times New Roman";
                }

                doc.SaveAs(ref outputFileName,
           ref fileFormat, ref oMissing, ref oMissing,
           ref oMissing, ref oMissing, ref oMissing, ref oMissing,
           ref oMissing, ref oMissing, ref oMissing, ref oMissing,
           ref oMissing, ref oMissing, ref oMissing, ref oMissing);

                object saveChanges = WdSaveOptions.wdSaveChanges;
                ((_Document)doc).Close(ref saveChanges, ref oMissing, ref oMissing);
                doc = null;

                ((_Application)word).Quit(ref oMissing, ref oMissing, ref oMissing);
                word = null;

                //using (var memoryStream = new MemoryStream())
                //{
                //FileInfo pathToDocx = new FileInfo(path);
                //XmlReader reader = XmlReader.Create(memoryStream, new XmlReaderSettings() { Async = true });
                //while (await reader.ReadAsync())
                //{
                //    text.Append(reader.Name + " - ");
                //    text.Append(reader.Value);
                //    text.AppendLine();
                //}
                //DocumentCore docx = DocumentCore.Load(pathToDocx.FullName);


                //}
                return outputFileName.ToString();
            }
            catch (Exception e)
            {

                object saveChanges = WdSaveOptions.wdDoNotSaveChanges;
                ((_Document)doc).Close(ref saveChanges, ref oMissing, ref oMissing);
                doc = null;

                ((_Application)word).Quit(ref oMissing, ref oMissing, ref oMissing);
                word = null;
            }
            return "";
        }
        private string GetExeDirectory()
        {
            string codeBase = System.Reflection.Assembly.GetExecutingAssembly().CodeBase;
            UriBuilder uri = new UriBuilder(codeBase);
            string path = Uri.UnescapeDataString(uri.Path);
            path = Path.GetDirectoryName(path);
            return path.Replace("\\","/");
        }
    }
}
