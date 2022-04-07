using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.Disciplines
{
    public class CategoryQuestion
    {
        public int? Id { get; set; }
        public string Name{ get; set; }
        public string NameEn { get; set; }
        public int Weight { get; set; }
        public int Number { get; set; }
        public int Count { get; set; }
        public int Rank { get; set; }
        public int StructureDisciplineId { get; set; }
        public bool IsActive { get; set; }
    }
}