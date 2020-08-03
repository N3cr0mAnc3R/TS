using Dapper;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace WebApp.Models.Logs
{
    public class LogManager : Manager
    {
        public LogManager(Concrete concrete) : base(concrete) { }
        public async Task SaveLog(Guid userUID, string ip, int ActionType)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                await cnt.ExecuteAsync(
                    sql: "[dbo].[UserAction_LogUpdate]",
                    new { userUID, ip, ActionType },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
    }
}