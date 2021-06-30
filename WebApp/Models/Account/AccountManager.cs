using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using WebApp.Models;

namespace WebApp.Models.Account
{
    public class AccountManager: Manager
    {
        public AccountManager(Concrete concrete) : base(concrete) { }

        public ApplicationUser GetUser(string userName, string localization = "ru", string password = null)
        {
            ApplicationUser user;

            using (var cnt = Concrete.OpenConnection())
            {
                user = (cnt.Query<ApplicationUser>("UserPlace_Authorization", new { userName, password, localization }, commandType: CommandType.StoredProcedure)).FirstOrDefault();
                //user.UserName = userName;
                //user.Id = user.Uuid.ToString();
            }

            return user;
        }
        /// <summary>
        /// 1-председатель, 2-член, 3-секретарь, 4-член приёмки, 5-поступающий, 6-админ аудитории, 7 - админ системы, 8 - гость
        /// </summary>
        /// <param name="userUID"></param>
        /// <returns></returns>
        public async Task<IEnumerable<int>> GetUserRoles(Guid? userUID)
        {
            
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<int>("Administrator_UserRoleGet", new { userUID }, commandType: CommandType.StoredProcedure);
            }
        }
        public async Task<IEnumerable<int>> GetAllUserRoles(Guid userUID)
        {
            
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                return await cnt.QueryAsync<int>("Administrator_UserRolesGet", new { userUID }, commandType: CommandType.StoredProcedure);
            }
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
        public async Task LoadNewUserIfNotExists(Guid guid)
        {
            using (var cnt = Concrete.OpenConnection())
            {
               await cnt.ExecuteAsync("Administrator_UserLoad", new { guid }, commandType: CommandType.StoredProcedure);
                //user.Id = user.Uuid.ToString();
            }
        }
        public ApplicationUser GetUser(Guid guid)
        {
            ApplicationUser user;

            using (var cnt = Concrete.OpenConnection())
            {
                user = (cnt.Query<ApplicationUser>("UserPlace_UserNameGet", new { guid }, commandType: CommandType.StoredProcedure)).FirstOrDefault();
                //user.Id = user.Uuid.ToString();
            }

            return user;
        }
        public bool HasOneOfRoles(IEnumerable<int> UserRoles, IEnumerable<int> CheckedRoles)
        {
            foreach (int role in UserRoles)
            {
                if (CheckedRoles.Contains(role))
                {
                    return true;
                }
            }
            return false;
        }
        public bool HasAllOfRoles(IEnumerable<int> UserRoles, IEnumerable<int> CheckedRoles)
        {
            if(CheckedRoles.Count() < 1)
            {
                return false;
            }
            bool result = true;
            foreach (int role in UserRoles)
            {
                if (!CheckedRoles.Contains(role))
                {
                    result = false;
                }
            }
            return result;
        }
    }
}