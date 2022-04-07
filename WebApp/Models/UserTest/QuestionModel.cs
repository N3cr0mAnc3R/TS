using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.UserTest
{
    public class QuestionModel
    {
        public int Id { get; set; }
        public int TypeAnswerId { get; set; }
        public string QuestionImage { get; set; }
        public int Rank { get; set; }
        public bool IsActive { get; set; }
        public IEnumerable<AnswerModel> Answers { get; set; }
    }
    public class QuestionEditModel
    {
        public int Id { get; set; }
        public int TypeAnswerId { get; set; }
        public string QuestionImage { get; set; }
        public int Rank { get; set; }
        public bool IsActive { get; set; }
        public IEnumerable<AnswerEditModel> Answers { get; set; }
    }
}