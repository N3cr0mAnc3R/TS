using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.Common
{
    public class TestResult
    {
        public int Id { get; set; }
        public string LastName { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public byte[] Picture { get; set; }
        public string PictureImage { get; set; }
        public DateTime TestingDate { get; set; }
        public float Score { get; set; }
        public string Discipline { get; set; }
        public int Count { get; set; }

    }
}