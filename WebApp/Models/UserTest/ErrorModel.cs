using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.UserTest
{
    public class ErrorModel
    {
        public int Id { get; set; }
        public int TestingProfileId { get; set; }
        public string Content { get; set; }
    }
}