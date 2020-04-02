using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data.Common;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace WebApp.Models
{
    public class Concrete : IDisposable
    {
        protected List<DbConnection> ConnectionHistory = new List<DbConnection>();

        protected string ConnectionString { get; set; }
        protected DbProviderFactory Factory { get; set; }

        public Concrete(ConnectionStringSettings settings)
        {
            ConnectionString = settings.ConnectionString;
            Factory = DbProviderFactories.GetFactory(settings.ProviderName);
        }



        public void UseConnection(Action<DbConnection> action)
        {
            using (DbConnection cnt = OpenConnection())
            {
                action(cnt);
            }
        }
        public async Task UseConnectionAsync(Action<DbConnection> action)
        {
            using (DbConnection cnt = await OpenConnectionAsync())
            {
                action(cnt);
            }
        }

        public async Task<DbConnection> OpenConnectionAsync()
        {
            DbConnection cnt = Factory.CreateConnection();
            cnt.ConnectionString = ConnectionString;
            await cnt.OpenAsync();

            ConnectionHistory.Add(cnt);
            return cnt;
        }
        public DbConnection OpenConnection()
        {
            DbConnection cnt = Factory.CreateConnection();
            cnt.ConnectionString = ConnectionString;
            cnt.Open();

            ConnectionHistory.Add(cnt);
            return cnt;
        }


        public void Dispose()
        {
            ConnectionHistory.ForEach(cnt =>
            {
                if (cnt.State != System.Data.ConnectionState.Closed) cnt.Close();
            });
        }
    }
}