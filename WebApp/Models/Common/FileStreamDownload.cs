using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.Common
{
    public class FileStreamDownload : FileStreamResult, IDisposable
    {
        public MvcResultSqlFileStream Stream { get; set; }

        public void Dispose()
        {
            Stream.Dispose();
        }
    }
}