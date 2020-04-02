using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Web;

namespace WebApplication1.Models
{
    public class Auditory
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Ip { get; set; }
        public Bitmap Stream { get; set; }

        public IEnumerable<TestComputer> ComputerList { get; set; }

    }
}