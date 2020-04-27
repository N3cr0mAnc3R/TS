using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.Common
{
    public class FileStreamResult
    {
        public string Name { get; set; }
        public string ContentType { get; set; }
        public long? Size { get; set; }
        public string Extension { get; set; }
        public DateTime UploadDate { get; set; }
        public string FileStreamPath { get; set; }
        public byte[] FileStreamContext { get; set; }
    }
}