using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.Administration
{
    public class AssignDisciplineModel
    {
        public int UserId { get; set; }
        public int DisciplineId { get; set; }
        public int PlaceId { get; set; }
        public DateTime Date { get; set; }

    }
}