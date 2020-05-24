using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.Proctoring
{
    public class TestResultScore
    {
        public int ExaminationBoardScoresId { get; set; }
        public int ExaminationBoardId { get; set; }
        public int TestingProfileId { get; set; }
        public int Score { get; set; }
        public DateTime Date { get; set; }

        public int UserId { get; set; }
    }
}