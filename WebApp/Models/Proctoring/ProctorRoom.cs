using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.Proctoring
{
    public class ProctorRoom
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public IEnumerable<ProctorUser> Users { get; set; }
        public List<TestUser> ComputerList { get; set; }
    }
}