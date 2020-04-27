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
        public int AnswerId { get; set; }
    }
}