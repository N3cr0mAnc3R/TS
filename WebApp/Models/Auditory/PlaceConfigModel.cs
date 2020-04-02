using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models
{
    public class PlaceConfigModel
    {
        public int Id { get; set; }
        public string PlaceConfig { get; set; }
        public string CameraConfig { get; set; }
        public int PlaceId { get; set; }
    }
}