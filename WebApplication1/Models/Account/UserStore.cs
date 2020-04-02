using Microsoft.AspNet.Identity;
using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace WebApplication1.Models.Account
{
    public class UserStore : IUserStore<ApplicationUser>, IUserPasswordStore<ApplicationUser>, IUserRoleStore<ApplicationUser>
    {
        public Task AddToRoleAsync(ApplicationUser user, string roleName)
        {
            throw new NotImplementedException();
        }

        public Task CreateAsync(ApplicationUser user)
        {
            throw new NotImplementedException();
        }

        public Task DeleteAsync(ApplicationUser user)
        {
            throw new NotImplementedException();
        }

        public void Dispose()
        {
           // throw new NotImplementedException();
        }

        public async Task<ApplicationUser> FindByIdAsync(string userId)
        {
            return await ViaCache("currentuser_", userId, u => AccountManager.GetUserByUuidAsync(userId));
        }

        public async Task<ApplicationUser> FindByNameAsync(string userName)
        {
            throw new NotImplementedException();
            //return await ViaCache("currentuser_", userName, u => AccountManager.GetUserByNameAsync(userName));
        }

        public Task<string> GetPasswordHashAsync(ApplicationUser user)
        {
            return Task.FromResult(user.UserName);
        }

        public async Task<IList<string>> GetRolesAsync(ApplicationUser user)
        {
            var roles = await ViaCache("currentuserroles_", user.UserName, u => AccountManager.GetRolesForUserAsync(user.UserName));

            return roles;
        }

        public Task<bool> HasPasswordAsync(ApplicationUser user)
        {
            throw new NotImplementedException();
        }

        public Task<bool> IsInRoleAsync(ApplicationUser user, string roleName)
        {
            return GetRolesAsync(user).ContinueWith(t => t.Result.Contains(roleName), TaskContinuationOptions.ExecuteSynchronously | TaskContinuationOptions.OnlyOnRanToCompletion);
        }

        public Task RemoveFromRoleAsync(ApplicationUser user, string roleName)
        {
            throw new NotImplementedException();
        }

        public Task SetPasswordHashAsync(ApplicationUser user, string passwordHash)
        {
            throw new NotImplementedException();
        }

        public Task UpdateAsync(ApplicationUser user)
        {
            throw new NotImplementedException();
        }
        protected AccountManager AccountManager
        {
            get
            {
                return HttpContext.Current.Request.GetOwinContext().Get<AccountManager>();

            }
        }
        T ViaCache<T>(string keyPrefix, string key, Func<string, T> fallback)
        {
            var context = HttpContext.Current != null ? HttpContext.Current.Request.RequestContext.HttpContext : default(HttpContextBase);

            var result = context != null ? (T)context.Items[keyPrefix + key] : default(T);

            if (result == null)
            {
                result = fallback(key);
                if (context != null) context.Items[keyPrefix + key] = result;
            }

            return result;
        }
    }
}