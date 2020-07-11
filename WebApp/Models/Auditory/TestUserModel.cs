using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models
{
    public class TestUserModel
    {
        public int Id { get; set; }
        public int StatusId { get; set; }
        public DateTime? Date { get; set; }
        public int? Auditory { get; set; }
    }
}