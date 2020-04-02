using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Web;

namespace WebApplication1.Models
{
    public class TestComputer
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public Bitmap Stream{ get; set; }
        public int PositionX { get; set; }
        public int PositionY { get; set; }
        public bool Busy { get; set; }
    }
}