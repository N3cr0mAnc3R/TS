using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.UserTest
{
    public class TestingPackage
    {
        public int Id { get; set; }
        public int TestingProfileId { get; set; }
        public int AnswerId { get; set; }
        public int Rank { get; set; }
        public int Sort { get; set; }
    }
}