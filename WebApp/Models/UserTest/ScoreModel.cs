using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.UserTest
{
    public class ScoreModel
    {
        public int MaxQuestionScore { get; set; }
        public int MaxStructureDisciplineScore { get; set; }
        public double Score { get; set; }
        public DateTime ScoreDate { get; set; }
    }
}