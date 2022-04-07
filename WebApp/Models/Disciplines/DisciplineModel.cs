using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.Disciplines
{
    public class DisciplineModel
    {
        public int Id { get; set; }
        public int DisciplineId { get; set; }
        public string Name { get; set; }
        public string NameEn { get; set; }
        public int Scale { get; set; }
        public int TestingTime { get; set; }
        public int Year { get; set; }
        public int TimeAlarm { get; set; }
        public int TypeTesting { get; set; }
        public int CountOfQuestions { get; set; }
        public int TestingPass { get; set; }

    }
}