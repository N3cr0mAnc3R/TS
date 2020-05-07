using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.Proctoring
{
    public class TestUser
    {
        public int Id { get; set; }
        public string FIO { get; set; }
        public string Specialty { get; set; }
        public int TestingProfileId { get; set; }
        public int TimeLeft { get; set; }
        public string Discipline { get; set; }
        public bool IsOnline { get; set; }
        public bool IsReady { get; set; }
    }
}