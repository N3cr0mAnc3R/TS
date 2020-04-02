using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;
using WebApp.Models;

namespace WebApp.Models.Account
{
    public class AccountManager: Manager
    {
        public AccountManager(Concrete concrete) : base(concrete) { }

        public ApplicationUser GetUser(string userName, string password)
        {
            ApplicationUser user;

            using (var cnt = Concrete.OpenConnection())
            {
                user = (cnt.Query<ApplicationUser>("UserPlace_Authorization", new { userName, password }, commandType: CommandType.StoredProcedure)).FirstOrDefault();
                user.UserName = userName;
                //user.Id = user.Uuid.ToString();
            }

            return user;
        }

        public ApplicationUser GetUser(string userName)
        {
            ApplicationUser user;

            using (var cnt = Concrete.OpenConnection())
            {
                user = (cnt.Query<ApplicationUser>("UserPlace_UserUIDGet", new { userName }, commandType: CommandType.StoredProcedure)).FirstOrDefault();
                user.UserName = userName;
                //user.Id = user.Uuid.ToString();
            }

            return user;
        }
    }
}