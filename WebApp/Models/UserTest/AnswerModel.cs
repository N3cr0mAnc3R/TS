using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.UserTest
{
    public class AnswerModel
    {
        public int Id { get; set; }
        public int QuestionId { get; set; }
        public string AnswerImage { get; set; }
        public int PackageId { get; set; }
        public int Sort { get; set; }
    }
    public class AnswerEditModel
    {
        public int Id { get; set; }
        public int QuestionId { get; set; }
        public string AnswerImage { get; set; }
        public int PackageId { get; set; }
        public int Sort { get; set; }
        public bool IsRight { get; set; }
    }
}