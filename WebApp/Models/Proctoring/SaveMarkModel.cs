using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.Proctoring
{
    public class SaveMarkModel
    {
        public int Id { get; set; }

        public int TestingResultId { get; set; }
        public int Score { get; set; }
        public int TestingProfileId { get; set; }
    }
}