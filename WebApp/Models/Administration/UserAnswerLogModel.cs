using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using WebApp.Models.Common;
using WebApp.Models.UserTest;

namespace WebApp.Models.Administration
{
    public class UserAnswerLogModel
    {
        public int TestingProfileId { get; set; }
        public int QuestionId { get; set; }
        public int Rank { get; set; }
        public int AnswerId { get; set; }
        public bool IsRight { get; set; }
        public string UserAnswer { get; set; }
        public DateTime Time { get; set; }
        public string QuestionImage { get; set; }
        public string AnswerImage { get; set; }

    }
    public class UserAnswer
    {
        public QuestionModel Question { get; set; }
        public int Rank { get; set; }
        public IEnumerable<AnswerModel> Answers { get; set; }
    }
    public class AnswerModel
    {
        public IndexItem Answer { get; set; }
        public bool IsRight { get; set; }
        public IEnumerable<UserAnswerModel> UserAnswers { get; set; }

    }
    public class UserAnswerModel
    {
        public int Id { get; set; }
        public string UserAnswer { get; set; }
        public DateTime Time { get; set; }
    }
}