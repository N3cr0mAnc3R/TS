using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebApp.Models.Proctoring
{
    public class ProctorUser
    {
        public int Id { get; set; }
        public Guid UserUid { get; set; }
        public string LastName { get; set; }
        public string FirstName { get; set; }
        public string MiddleName { get; set; }
        public int UserRoleId { get; set; }
        public string DisciplineName { get; set; }
        public bool IsOnline { get; set; }
        public string fio { get; set; }
        public string UserRolesName { get; set; }

    }
}