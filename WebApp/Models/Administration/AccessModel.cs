using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.Administration
{
    public class AccessModel
    {
        public int UserId { get; set; }
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
        public bool IsActive { get; set; }
        public int AuditoriumId { get; set; }
    }
}