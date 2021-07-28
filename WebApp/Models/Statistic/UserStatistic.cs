using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.Statistic
{
    public class UserStatistic
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public Guid Guid { get; set; }
        public DateTime DateFrom { get; set; }
        public DateTime DateTo { get; set; }
        public byte[] Picture { get; set; }
        public string PictureImage
        {
            get
            {
                if (Picture != null)
                    return Convert.ToBase64String(Picture);
                return null;
            }
        }
    }
}