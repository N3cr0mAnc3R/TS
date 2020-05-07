using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;

namespace WebApp.Models.Proctoring
{
    public class ProctorManager : Manager
    {
        public ProctorManager(Concrete concrete) : base(concrete) { }


        public IEnumerable<ProctorUser> GetProctorUsers(int TestingProfileId, Guid? userUID, string localization = "")
        {
            using (var cnt = Concrete.OpenConnection())
            {
                return cnt.Query<ProctorUser>(
                    sql: "[dbo].[Administrator_ChatRoomUsersGet]",
                    new { userUID, TestingProfileId, localization },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
    }
}