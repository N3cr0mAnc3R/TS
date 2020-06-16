using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.UserTest
{
    public class TestingModel
    {
        public int Id { get; set; }
        public int TestingStatusId { get; set; }
        public bool NeedShowScore { get; set; }
        public bool IsForTesting { get; set; }
        public DateTime TestingDate { get; set; }
        public Guid userUID { get; set; }
        public string LastName { get; set; }
        public string FirstName { get; set; }
        //Отчество
        public string MiddleName { get; set; }
        public string DisciplineName { get; set; }
        public string TestingStatusName { get; set; }
        public int Score { get; set; }

    }
}