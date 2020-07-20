using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.Common
{
    public class ChatMessage
    {
        public int Id { get; set; }
        public string Message { get; set; }
        public DateTime Date { get; set; }
        public bool IsSender { get; set; }
        public int TestingProfileId { get; set; }
        public int? ParentId { get; set; }
        public Guid? UserIdFrom { get; set; }
        public Guid? UserIdTo { get; set; }
        public bool ForCreate { get; set; }
        public bool ForReset{ get; set; }
        public byte[] Stream { get; set; }
    }
}