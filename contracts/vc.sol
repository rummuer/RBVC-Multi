pragma solidity ^0.5.0;
contract vc {
    address payable delegator=msg.sender;
    uint reward;
    uint deposit;
    uint fine;
    uint256 intent_ended;
    uint256 claim_ended;
    uint256 reveal_ended;
    uint256 numWor=0;
    uint in_round=1;
    uint k = 5; // number of workers per round
    enum state{init,created,compute,agreed}
    state s=state.init;
    enum Wtype{NA,H,M} // H - honest, M - malicious, NA - shown intent but work not assigned
    //structure to track index numbers
    struct Worker {
        address payable name;
        bool selected;
    }
    // structure to store worker data
   struct newWorker {
       address payable name;
       uint id;
       bool selected;
       uint round;
       bytes32 secret;
       bool iscommitted;
       bool isRevealed;
       bytes32 ish;
       Wtype wtype;
   }

    mapping(uint => Worker) workers;
    mapping(address => newWorker) w;

    modifier notDelegator {require(msg.sender!=delegator,"Delegator should not show intent");   _;  }
    modifier onlyDelegator {require(msg.sender==delegator,"Only Delegator should call");_;}
    modifier onlyBefore(uint _time,string memory message) { require(block.timestamp<_time,message) ; _;   }
    modifier onlyAfter(uint  _time,string memory message) { require(block.timestamp>_time,message) ; _;   }
    modifier onlyEnoughDeposit(uint  val) {require(val>=reward,"Not enough deposit"); _;}

    event contractCreated(address _contractaddress, address _delegator, uint _reward, uint256 _intent_ended, uint256 _claim_ended, uint256 _current_time);
    event workerAdded(address _worker_address, uint deposit, uint _current_block,uint _worker_number,bytes32 _committed_secret);
    event status(uint n,address _worker_address,bool _selected, uint round, Wtype w);
    event ISHCommitted(address _worker_address,bytes32 ISH);
    event ISHRevealed(address _worker_address,bytes32 b);
    event PayoutDone(string c);
    event getcount(uint c);
    //function to get block reward and also to set timing parameters, this can also be written as constructor
    function createJob(uint256  x,  uint256  y) public payable onlyDelegator{
        require(s==state.init,"Contract not yet created");
        reward = msg.value;                         // reward sent as a message value
        intent_ended = block.timestamp + x;         //time to close intent round
        claim_ended = block.timestamp + y/2;
        reveal_ended = block.timestamp + y;      // time to close claim round
        s = state.created;
        emit contractCreated(address(this),delegator,reward,intent_ended,claim_ended,block.timestamp);
      }
    // Workers show intent by sending deposit along with hash of some integer, which is used later to mask ish value.
    function showIntent(bytes32  _secret) public payable notDelegator /*onlyBefore(intent_ended,"intent timed out")*/ onlyEnoughDeposit(msg.value) {
        require(checkDuplicate(msg.sender),"Duplicate Entry");  // To avoid multiple intents from same address
        require(s==state.created,"Job not yet created");        // To check Job has created
        numWor +=1;                                             // workers count
        workers[numWor] = Worker(msg.sender,false);
        w[msg.sender].name = msg.sender;
        w[msg.sender].id = numWor;
        w[msg.sender].round = 0;
        w[msg.sender].secret = _secret;
        w[msg.sender].iscommitted = false;
        w[msg.sender].isRevealed = false;
        w[msg.sender].ish ='';
        w[msg.sender].wtype = Wtype.NA;
        deposit =deposit+msg.value;                           // Workers deposits accumalated
        emit workerAdded(msg.sender,msg.value,block.timestamp,numWor,_secret);
        }
    // using salt to randomise as much as possible, anybody can call this function but we are restricting to only delegator
    // This function selects random workers. Only selected workers are eligible to compute the work.
   function compute(string memory salt) /*onlyAfter(intent_ended,"intent time not yet finished")*/ onlyDelegator public
   {
      uint count=0;
      uint winner;
      uint n=numWor;
      //uint k=n/2;                                           // Number of workers per round
      // Taking hash of the n*10(no particular reason for this choice) block from current block and again hashing it by adding salt
      bytes32 seed = keccak256(abi.encodePacked(block.timestamp,salt));
      while(count<k)
      {
          winner = uint(seed)%n;
          if(winner<1) {
            winner = 1 - winner;
          }
        while(workers[winner].selected == true)
        {
            seed = keccak256(abi.encodePacked(seed,salt));
            winner = uint(seed)%n;
            if(winner<1) {
              winner = 1 - winner;
            }
          }
      workers[winner].selected = true;
      address a = workers[winner].name;
      w[a].selected = true;
      w[a].round = in_round;
      seed=keccak256(abi.encodePacked(seed,salt));
      count++;
      }
    in_round++;                          // round number is incremented
    s =state.compute;
    for(uint i=1;i<=n;i++) {
        knowStatus(workers[i].name);
      }
    }
    function knowStatus(address a) internal {
        emit status(numWor,w[a].name,w[a].selected,w[a].round,w[a].wtype);
      }
    // ish hashed along with random number commited while showing intent is committed
    function commitISH(bytes32  c) /*onlyBefore(claim_ended,"Claim ENDED")*/  public {
       require(s==state.compute,"Compute not yet called");                    // only after compute is called
       require(w[msg.sender].selected==true,"sender not selected");           // only selected worker must commit
       require(w[msg.sender].iscommitted == false,"sender Already committed"); // only one chance to commit
       w[msg.sender].ish =c;
       w[msg.sender].iscommitted = true;
      emit ISHCommitted(msg.sender,c);
      }
    // after commit time expires workers can reveal their ish
    function revealISH(bytes32  ISH,string memory rs) /*onlyAfter(claim_ended,"Commit not yet ended") onlyBefore(reveal_ended,"Reveal ENDED")*/ public {
        require(w[msg.sender].selected==true,"sender not selected");          // only selected worker must reveal
        require(w[msg.sender].iscommitted == true,"sender not committed");    // only worker who committed ish must reveal
        require(w[msg.sender].isRevealed == false,"Sender already revealed"); // only one chance to reveal
        require(keccak256(abi.encodePacked(rs))==w[msg.sender].secret,"Not a committed value"); // checking correctness of random number previously committed
        require(keccak256(abi.encodePacked(ISH))==w[msg.sender].ish,"Not a committed ISH");     // checking correctness of ish previously committed
        w[msg.sender].ish=ISH;
        w[msg.sender].isRevealed==true;
        emit ISHRevealed(msg.sender,ISH);
    }
     function check() public onlyDelegator {
        uint co=0;
        uint n = numWor;
        //uint k = 5;
        bytes32 winRish;
        for(uint i=1;i<=n;i++)
        {
            for(uint j=i+1;j<=n;j++) {
                address a = workers[i].name;
                address b = workers[j].name;
                if(w[a].round == in_round-1 && w[b].round == in_round-1  && w[a].ish == w[b].ish) {
                    co++;
                }
            }
        }
       // emit getcount(co);
            if(co == (k*(k-1))/2) {
              s = state.agreed;
                for(uint z=1;z<=n;z++) {
                    address c = workers[z].name;
                   if(w[c].round == in_round-1)  {
                       w[c].wtype = Wtype.H;
                        winRish = w[c].ish;
                      }
                }
            }
            else {
              s=state.created;

            }
          if(in_round-1>1)
         {
             for(uint z1=1;z1<=n;z1++) {
                 address d = workers[z1].name;
              if(w[d].ish == winRish && w[d].wtype == Wtype.NA)
              {
                w[d].wtype = Wtype.H;
              }
              if(w[d].ish!= winRish && w[d].selected == true && w[d].wtype == Wtype.NA)
              {
                w[d].wtype = Wtype.M;
                 emit PayoutDone("Malicious found");
              }
              else {emit PayoutDone("Malicious not found");}
            }
      }

    }

    function payout() public payable  {
    require(s==state.agreed,"Not agreed");
     if(s==state.agreed){
        uint ma=0;
        uint na = 0;
        uint n = numWor;
      //  uint k = n/2;
        for(uint i1=1;i1<=n;i1++) {
            address a = workers[i1].name;
            if(w[a].wtype==Wtype.M) {
                ma++;
            }
        }
        for(uint i1=1;i1<=n;i1++) {
            address a = workers[i1].name;
            if(w[a].wtype==Wtype.NA) {
                na++;
            }
        }
       uint ha = n - ma-na;

     /*   for(uint i=1;i<=n;i++) {
            address payable b = workers[i].name;
            if(w[b].wtype==Wtype.H) {
              w[b].name.transfer((reward/((k*(in_round-1))-ma))+(deposit/n-ma));
           // emit status(numWor,w[b].name,w[b].selected,w[b].round,w[b].wtype);
            }
            if(w[b].wtype==Wtype.NA) {
            w[b].name.transfer((deposit)/n);
               // emit status(numWor,w[b].name,w[b].selected,w[b].round,w[b].wtype);
           }
        } */uint madeposit;
        if(n-ha-na >=1){madeposit = deposit/n-ha-na;}
        else { madeposit =0;}
        
        for(uint i=1;i<=n;i++){
          address payable b = workers[i].name;
          if(w[b].wtype==Wtype.H){
            b.transfer((reward/((k*(in_round-1))-ma))+(deposit/n) + madeposit/ha);
          }
          if(w[b].wtype==Wtype.NA){ b.transfer((deposit)/n);}
         
        }
        emit PayoutDone("agreed");
    }
    else{
    emit PayoutDone("disagreed");
}
}

    function checkDuplicate(address wor) internal view returns(bool){
             if(w[wor].name == wor )
            {
                return false;
            }

        return true;
    }


}
