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
        public async Task SaveLog(Guid userUID, string ip, ActionType actionType)
        {
            using (var cnt = await Concrete.OpenConnectionAsync())
            {
                int action = (int)actionType;
                await cnt.ExecuteAsync(
                    sql: "[dbo].[UserAction_LogUpdate]",
                    new { userUID, ip, ActionType = action },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
    }
    public enum ActionType
    {
        User_Auth = 1,
        User_StartTest = 2,
        User_SaveAnswer = 3,
        User_FinishTest = 4

    }
}