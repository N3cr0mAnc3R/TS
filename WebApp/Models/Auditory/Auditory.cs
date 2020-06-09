using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Web;

namespace WebApp.Models
{
    public class Auditory
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Ip { get; set; }
        public Bitmap Stream { get; set; }
        public bool NeedPin { get; set; }
        public bool isDynamic { get; set; }
        public IEnumerable<TestComputer> ComputerList { get; set; }

    }
}