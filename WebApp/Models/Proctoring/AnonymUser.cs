using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.Proctoring
{
    public class AnonymUser
    {
        public int TestingProfileId { get; set; }
        public int StructureDisciplineId { get; set; }
        public int UserId { get; set; }
    }
}