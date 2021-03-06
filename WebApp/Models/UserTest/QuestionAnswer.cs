using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.UserTest
{
    public class QuestionAnswer
    {
        public int Id { get; set; }
        public int TestingPackageId { get; set; }
        public DateTime DateTime { get; set; }
        public int TestingTime { get; set; }
        public string UserAnswer { get; set; }
        public Guid? FileId { get; set; }
        public int AnswerId { get; set; }
        public int Sort { get; set; }
        public int TypeAnswerId { get; set; }
        public int TestingResultId { get; set; }
    }
}