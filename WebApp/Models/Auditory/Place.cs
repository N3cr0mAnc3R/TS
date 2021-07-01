using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models
{
    public class Place
    {
        public int Id { get; set; }
        public string Number { get; set; }
        public bool IsUsed { get; set; }
    }
}