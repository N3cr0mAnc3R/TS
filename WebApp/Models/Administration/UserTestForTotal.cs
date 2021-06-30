using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.Administration
{
    public class UserTestForTotal
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public double Score { get; set; }
        public string Status { get; set; }
        public int StatusId { get; set; }
        public DateTime? TestingDate { get; set; }
        public DateTime? TestingBegin{ get; set; }
        public DateTime? TestingEnd{ get; set; }
        public bool IsReport { get; set; }
        public bool IsAdmin { get; set; }
    }
}