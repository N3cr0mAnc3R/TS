using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.UserTest
{
    public class QwestionModel
    {
        public int Id { get; set; }
        public int TypeAnswerId { get; set; }
        public string QwestionImage { get; set; }
        public int Rank { get; set; }
        public IEnumerable<AnswerModel> Answers { get; set; }
    }
}