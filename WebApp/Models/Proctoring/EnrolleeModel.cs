using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.Proctoring
{
    public class EnrolleeModel
    {
        public int UserId { get; set; }
        public string NameDiscipline { get; set; }
        public string TestingUserTime { get; set; }
    }
}