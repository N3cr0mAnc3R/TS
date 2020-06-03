using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.Common
{
    public class TestUser
    {
        public int Id { get; set; }
        public Guid UserUid { get; set; }
        public string LastName { get; set; }
        public string FirestName { get; set; }
        public string MiddleName { get; set; }
        public byte[] Picture { get; set; }
        public string PictureImage { get; set; }
    }
}