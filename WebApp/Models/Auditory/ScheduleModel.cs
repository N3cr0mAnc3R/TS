using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models
{
    public class ScheduleModel
    {
        public int Id { get; set; }
        public string LastName { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public int PlaceId { get; set; }
        public string Discipline { get; set; }
        public int TestingTime { get; set; }
        public DateTime? Date { get; set; }

        public float? Score { get; set; }
    }
}