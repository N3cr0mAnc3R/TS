using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.Statistic
{
    public class FullTestingProfileModel
    {
        public DateTime? date { get; set; } = null;
        public int? structureDisciplineId { get; set; } = null;
        public int? testingStatusId { get; set; } = null;
        public bool? needTime { get; set; } = null;
        public DateTime? testingTime { get; set; } = null;
        public string lastName { get; set; } = null;
        public string firstName { get; set; } = null;
        public int? auditoriumId { get; set; } = null;
        public int? Year { get; set; } = null;
    }
}