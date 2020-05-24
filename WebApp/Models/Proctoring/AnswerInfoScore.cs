using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.Proctoring
{
    public class AnswerInfoScore
    {
        public int ExaminationBoardTestingResultScoreId { get; set; }
        public int ExaminationBoardId { get; set; }
        public int TestingResultId { get; set; }
        public int Score { get; set; }
        public DateTime Date { get; set; }
        public int UserId { get; set; }
    }
}