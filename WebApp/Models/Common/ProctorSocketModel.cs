using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.Common
{
    public class ProctorSocketModel
    {
        public int Id { get; set; }
        public dynamic Data { get; set; }
        public int TestingProfileId { get; set; }
        public bool ForCreate { get; set; }
    }
}