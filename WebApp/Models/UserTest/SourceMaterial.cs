using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.UserTest
{
    public class SourceMaterial
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public byte[]  SourceMaterialImage { get; set; }
        public string Image { get; set; }
        public bool IsCalc { get; set; }
    }
}