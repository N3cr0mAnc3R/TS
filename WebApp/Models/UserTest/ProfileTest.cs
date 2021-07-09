using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.UserTest
{
    public class ProfileTest
    {
        public int Id { get; set; }
        public string Status { get; set; }
        public int StatusId { get; set; }
        public double? Score { get; set; }
        public DateTime TestingDate { get; set; }
        public string Discipline { get; set; }
        public bool? Passed { get; set; }
    }
}