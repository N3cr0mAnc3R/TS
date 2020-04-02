using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace WebApplication1.Models.Account
{
    public class AccountManager: Manager
    {
        public AccountManager(Concrete concrete) : base(concrete) { }

        /// <summary>
        /// Получить пользователя по идентификатору membership
        /// </summary>
        /// <param name="uuid">Идентификатор в membership</param>
        /// <returns>Объект пользователя</returns>
        public async Task<ApplicationUser> GetUserByUuidAsync(string uuid)
        {
            ApplicationUser user;

            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                user = (await cnt.QueryAsync<ApplicationUser>("Security.Campus_GetUserByUuid", new { uuid }, commandType: CommandType.StoredProcedure)).FirstOrDefault();
            }

            return user;
        }
        /// <summary>
        /// Получить пользователя по идентификатору membership
        /// </summary>
        /// <param name="uuid">Идентификатор в membership</param>
        /// <returns>Объект пользователя</returns>
        public async Task<ApplicationUser> GetUser(string userName, string password)
        {
            ApplicationUser user;

            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                user = (await cnt.QueryAsync<ApplicationUser>("UserPlace_Aauthorization", new { userName, password }, commandType: CommandType.StoredProcedure)).FirstOrDefault();
                user.UserName = "Administrator";
                user.Id = user.Uuid.ToString();
            }

            return user;
        }

        /// <summary>
        /// Получить пользователя по идентификатору человека в деканате (kod_card)
        /// </summary>
        /// <param name="personId">Идентификатор в деканате (kod_card)</param>
        /// <returns>Объект пользователя</returns>
        public async Task<ApplicationUser> GetUserByPersonIdAsync(int personId)
        {
            ApplicationUser user;

            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                user = (await cnt.QueryAsync<ApplicationUser>("Security.Campus_GetUserByPersonId", new { personId }, commandType: CommandType.StoredProcedure)).FirstOrDefault();
            }

            return user;
        }
        public async Task<IList<string>> GetRolesForUserAsync(string userName)
        {
            IList<string> roles;

            using (var cnt = Concrete.OpenConnection())
            {
                roles = (await cnt.QueryAsync("Security.GetRoleForUser", new { UserName = userName }, commandType: CommandType.StoredProcedure)).Select(i => (string)i.Name).ToArray();
            }

            return roles;
        }
        public bool IsUserValid(string userName, string password)
        {
            var membership = new System.Web.Security.SqlMembershipProvider();
            membership.Initialize(null, new System.Collections.Specialized.NameValueCollection() { /*{ "providerName", "SqlProvider" },*/ { "connectionStringName", "Testing" }, { "applicationName", "Iams VUZ" }, { "maxInvalidPasswordAttempts", "50" } });

            return membership.ValidateUser(userName, password);
        }

    }
}