using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Web;
using WebApp.Models.Common;

namespace WebApp.Models
{
    public class TestComputer: IndexItem
    {
        public string LastName { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public Bitmap Stream{ get; set; }
        public int PositionX { get; set; }
        public int PositionY { get; set; }
        public bool IsUsed { get; set; }
        public bool IsCameraControl { get; set; }
        public bool IsRecordOnStart { get; set; }
        public bool IsRecordOnViolation { get; set; }
        public bool IsRecordOnWarning { get; set; }
        public bool Deleted { get; set; }
        public bool IsNeedPlaceConfig { get; set; }
        public int PlaceProfileId { get; set; }
        public int PIN { get; set; }
        public int TestingProfileId { get; set; }
    }
}