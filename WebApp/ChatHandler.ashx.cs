using Microsoft.AspNet.Identity.Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.Helpers;
using System.Web.WebSockets;
using WebApp.Models;
using WebApp.Models.Account;
using WebApp.Models.Common;
using WebApp.Models.Proctoring;

namespace WebApp
{
    /// <summary>
    /// Сводное описание для ChatHandler
    /// </summary>
    public class ChatHandler : IHttpHandler
    {
        private static readonly Dictionary<int, List<WebSocket>> Clients = new Dictionary<int, List<WebSocket>>(); 
        private static readonly ReaderWriterLockSlim Locker = new ReaderWriterLockSlim();
        public void ProcessRequest(HttpContext context)
        {
            if (context.IsWebSocketRequest)
                context.AcceptWebSocketRequest(WebSocketRequest);
        }
        private async Task WebSocketRequest(AspNetWebSocketContext context)
        {
            // Получаем сокет клиента из контекста запроса
            var socket = context.WebSocket;

            // Добавляем его в список клиентов
            Locker.EnterWriteLock();
            try
            {
                //ToDo change
                //if (!Clients.ContainsKey(1)) Clients.Add(1, socket);
            }
            catch(Exception e)
            {

            }
            finally
            {
                Locker.ExitWriteLock();
            }

            // Слушаем его
            while (true)
            {
                var buffer = new ArraySegment<byte>(new byte[1024]);

                // Ожидаем данные от него
                var result = await socket.ReceiveAsync(buffer, CancellationToken.None);
                ChatMessage jsonparsed = new ChatMessage();
                try {

                    string cathing = System.Text.Encoding.UTF8.GetString(buffer.Array);
                    int nStrtP = cathing.IndexOf("\0");
                    if (nStrtP != -1) //вхождение нулевого символ найденj
                    {
                        cathing = cathing.Substring(0, nStrtP); //выбираем ограниченный символами текст                
                    }
                    jsonparsed = Json.Decode<ChatMessage>(cathing);

                    if (jsonparsed.ForCreate)
                    {
                        if (!Clients.ContainsKey(jsonparsed.TestingProfileId)) Clients.Add(jsonparsed.TestingProfileId, new List<WebSocket>() { socket });
                        else
                        {
                            List<WebSocket> foundedClient = Clients.Where(a => a.Key == jsonparsed.TestingProfileId).FirstOrDefault().Value;
                            if (!foundedClient.Contains(socket))
                            {
                                foundedClient.Add(socket);
                            }
                        }
                    }
                    else
                    {
                        if (jsonparsed.IsSender)
                        {
                            jsonparsed.UserIdFrom = null;
                            jsonparsed.UserIdTo = null;
                        }
                        else
                        {
                            jsonparsed.UserIdFrom = AccountManager.GetUser(((ClaimsIdentity)context.User.Identity).Claims.Select(a => a.Value).FirstOrDefault()).Id;
                        }
                        await TestManager.SendMessage(jsonparsed);
                        var newJson = Json.Encode(jsonparsed);
                        buffer = new ArraySegment<byte>(System.Text.Encoding.UTF8.GetBytes(newJson));
                        List<WebSocket> disposedClients = new List<WebSocket>();
                        //Передаём сообщение всем клиентам
                        foreach (var client in Clients.Where(A => A.Key == jsonparsed.TestingProfileId).FirstOrDefault().Value)
                        {

                            // WebSocket client = client1;

                            try
                            {
                                if (client.State == WebSocketState.Open)
                                {
                                    await client.SendAsync(buffer, WebSocketMessageType.Text, true, CancellationToken.None);
                                }
                            }

                            catch (ObjectDisposedException)
                            {
                                Locker.EnterWriteLock();
                                try
                                {
                                    List<WebSocket> cls = Clients.Where(A => A.Key == jsonparsed.TestingProfileId).FirstOrDefault().Value;
                                    //cls.Remove(client);
                                    disposedClients.Add(client);
                                    //Clients.Remove
                                    // Clients.Remove(Clients.Where(a => a.Value == client).FirstOrDefault().Key);
                                    //i--;
                                }
                                finally
                                {
                                    Locker.ExitWriteLock();
                                }
                            }
                        }
                        for (int i = 0; i < disposedClients.Count; i++)
                        {
                            List<WebSocket> cls = Clients.Where(A => A.Key == jsonparsed.TestingProfileId).FirstOrDefault().Value;
                            cls.Remove(cls[i]);
                        }
                    }
                }
                catch(Exception e)
                {

                }
            }
        }
        public bool IsReusable
        {
            get
            {
                return false;
            }
        }

        protected ProctorManager ProctorManager
        {
            get
            {
                return HttpContext.Current.Request.GetOwinContext().Get<ProctorManager>();
            }
        }

        protected TestManager TestManager
        {
            get
            {
                return HttpContext.Current.Request.GetOwinContext().Get<TestManager>();
            }
        }
        protected AccountManager AccountManager
        {
            get
            {
                return HttpContext.Current.Request.GetOwinContext().Get<AccountManager>();
            }
        }
    }
}