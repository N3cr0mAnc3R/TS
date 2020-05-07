using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.UserTest
{
    public class Violation
    {
        public int TestingProfileId { get; set; }
        public int ViolationTypeId { get; set; }
        public string ViolationTypeName { get; set; }
        public int ViolationLevelId { get; set; }
        public string ViolationLevelName { get; set; }
        public int ViolationCount { get; set; }
    }
}